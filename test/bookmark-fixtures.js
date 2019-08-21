const uuid = require('uuid/v4');

function makeBookmarksArray() {
    return [
        {
            id: uuid(),
            title: 'Google',
            url: 'https://www.google.com',
            description: 'my favorite search engine',
            rating: 4
        },
        { 
            id: uuid(),
            title: 'Thinkful',
            url: 'https://www.thinkful.com',
            description: 'Think outside the classroom',
            rating: 5 
        }
    ]
  }
  
  module.exports = {
    makeBookmarksArray,
  }
  