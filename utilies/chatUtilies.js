

/**
 * Chat Class for function utilies
 */
class ChatUtilies {

   /* Function for choosing elements */
   static selectItems = (selectedItems) => {
      const itemsSelected = {}
      if (!Array.isArray(selectedItems))
         return (null)

      selectedItems.forEach(element => {
         itemsSelected[`${element}`] = true
      });

      return (itemsSelected)
   }

   /* Emit new event between all users
   NOTE: allParts must be array of users IDS */
   static emitMessage = (io, allParts, usersObject, event, returnObject) => {
      for (let i = 0; i < allParts.length; i++) {
         const client = usersObject[allParts[i]]
         if (client) {
            io.to(client).emit(event, returnObject);
         }
      }
   }

   /* Function fo checking whether user is admin or not */
   static checkUserAdmin = async (prismaObj, chatId) => {
      try {
         const admins = await prismaObj.chat.findUnique({
            where: {
               id: chatId
            },
            select: {
               admins: { select: {
                  id: true
               }}
            }
         })

         return (admins)
      } catch (err) {
         return (null)
      }
   }

   /* Function to create new chat room
      if not chat rooms exists between 2 users*/
   static createChatRoom = async (primsa, usersIds) => {
      if (!Array.isArray(usersIds))
         return (null)

      try{
         let getChatId = await primsa.chat.create({
            data: {
               name: "",
               bio: "",
               participants: {
                  connect: usersIds.map(id => ({ id }))
               }
            },
            select: {
               id: true
            }
         })

         getChatId = getChatId.id
         return (getChatId)
      } catch (err) {
         return (null)
      }
   }
}

export default ChatUtilies;
