const app = require('../src/app');
const { bookmarks } = require('../src/store');

// describe('Bookmark Endpoints', () => {
//   let bookmarksCopy;
//   beforeEach('copy the bookmarks', () => {
//     bookmarksCopy = bookmarks.slice();
//   })
//   afterEach('restore the bookmarks', () => {
//     bookmarks = bookmarksCopy;
//   })

  describe('Unauthorized requests', () => {
    it('responds with 401 Unauthorized with GET /bookmarks', () => {
      return supertest(app)
        .get('/bookmarks')
        .expect(401, {error: 'Unauthorized request'})
    })

    it('responds with 401 Unauthorized with GET /bookmarks/:id', () => {
      const bookmarkID = bookmarks[0];
      return supertest(app)
        .get(`/bookmarks/${bookmarkID}`)
        .expect(401, {error: 'Unauthorized request'})
    })

    it('responds with 401 Unauthorized with POST /bookmarks', () => {
      return supertest(app)
        .post(`/bookmarks`)
        .send({ 
          title: 'test', 
          url: 'www.something.com',
          rating: 4
        })
        .expect(401, {error: 'Unauthorized request'})
    })

    it('responds with 401 Unauthorized with DELETE /bookmarks/:id', () => {
      const bookmarkID = bookmarks[0];
      return supertest(app)
        .delete(`/bookmarks/${bookmarkID}`)
        .expect(401, {error: 'Unauthorized request'})
    })
  })

  describe('GET /bookmarks', () => {
    it('GET /bookmarks responds with list of bookmarks from the store', () => {
      return supertest(app)
        .get('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200, bookmarks)
    })
  })

  describe('POST /bookmarks', () => {
    it('responds with 400 when title is not provided', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({
            url: 'http://www.something.com', 
            rating: 4})
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, 'Invalid data')
    })

    it('responds with 400 when URL is not provided', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({
          title: 'test', 
          rating: 4})
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, 'Invalid data')
    })

    it('responds with 400 when rating is not provided', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({
          title: 'test', 
          url: 'http://www.something.com'})
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, 'Invalid data')
    })

    it('responds with 400 when rating is invalid', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({
          title: 'test', 
          url: 'http://www.something.com',
          rating: 'invalid'})
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, 'Rating must be an integer between 0 and 5.')
    })

    it('responds with 400 when url is invalid', () => {
      return supertest(app)
      .post('/bookmarks')
      .send({
        title: 'test', 
        url: 'invalid',
        rating: 4})
      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
      .expect(400, 'URL must be valid.')
    })

    it('responds 201 when new bookmark was successfully posted to the store', () => {
      const newBookmark = {
        title: 'test',
        url: 'http://www.something.com',
        description: 'example description',
        rating: 4
      };
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body.id).to.be.a('string')
        })
        .then(res => {
          expect(bookmarks[bookmarks.length - 1]).to.eql(res.body)
        })
    })
  })

  describe('GET /bookmarks/:id', () => {
    it('GET bookmark by id', () => {
      const bookmark = bookmarks[0];
      return supertest(app)
        .get(`/bookmarks/${bookmark.id}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200, bookmark)
    })

    it('responds with 404 if bookmark with that ID does not exist', () => {
      return supertest(app)
        .get('/bookmarks/invalid')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(404, 'That bookmark was not found.')
      
    })
  })

  describe('DELETE /bookmarks/:id', () => {
    it('responds with 404 when bookmark with that ID does not exist', () => {
      return supertest(app)
      .delete(`/bookmarks/invalidId`)
      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
      .expect(404, 'Not found')
    })

    it('removes bookmark by ID from the store', () => {
      const bookmark = bookmarks[0];
      const expectedBookmarks = bookmarks.filter(b => b.id !== bookmark.id);
      return supertest(app)
      .delete(`/bookmarks/${bookmark.id}`)
      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
      .expect(204)
      .then(() => {
        expect(bookmarks).to.eql(expectedBookmarks)
      })
    })
  })

  describe('Bookmarks App', () => {
    it('GET / responds with 200 containing "Hello, world!"', () => {
      return supertest(app)
        .get('/')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200, 'Hello, world!')
    })
  })
// })