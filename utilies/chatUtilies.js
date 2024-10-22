

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
}

export default ChatUtilies;
