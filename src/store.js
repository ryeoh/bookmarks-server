const uuid = require('uuid/v4');

const bookmarks = [
    {
        id: uuid(),
        title: 'Goodle',
        url: 'www.goodle.com',
        description: 'my favorite search engine as it finds some gooood stuff',
        rating: 4
    }
]

module.exports = { bookmarks };