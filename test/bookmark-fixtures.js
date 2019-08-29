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

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911, 
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'https://www.hackers.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 1,
    }
    const expectedBookmark = {
        ...maliciousBookmark,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
        maliciousBookmark,
        expectedBookmark
    }
}
  
  module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark
  }
  