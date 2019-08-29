const knex = require('knex');
const fixtures = require('./bookmark-fixtures');
const app = require('../src/app');
// const { bookmarks } = require('../src/store');

describe('Bookmark Endpoints', () => {
  let db;
  
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('Unauthorized requests', () => {
    const testBookmarks = fixtures.makeBookmarksArray();

    beforeEach('insert bookmarks', () => {
      return db
        .into('bookmarks')
        .insert(testBookmarks)
    })

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
    context('Given no bookmarks', () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    context('Given there are bookmarks in database', () => {
      const testBookmarks = fixtures.makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('gets bookmarks from the store', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks)
      })
    })
  })

  context(`Given an XSS attack bookmark`, () => {
    const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark();

    beforeEach('insert malicious bookmark', () => {
      return db
        .into('bookmarks')
        .insert([maliciousBookmark])
    })

    it('removes XSS attack content', () => {
      return supertest(app)
        .get(`/bookmarks`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200)
        .expect(res => {
          expect(res.body[0].title).to.eql(expectedBookmark.title)
          expect(res.body[0].description).to.eql(expectedBookmark.description)
        })
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

    it('adds a new bookmark to the store', () => {
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
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
        })
        .then(res => {
          supertest(app)
            .get(`/bookmarks/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        })
    })

    it('removes XSS attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()
      return supertest(app)
        .post(`/bookmarks`)
        .send(maliciousBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        })
    })
  })

  describe('GET /bookmarks/:id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 when bookmark doesn't exist`, () => {
        return supertest(app)
          .get(`/bookmarks/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark Not Found` }
          })
      })
    })

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/$bookmarkId`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark)
      })
    })
  })

  context(`Given an XSS attack bookmark`, () => {
    const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark();

    beforeEach('insert malicious bookmark', () => {
      return db
        .into('bookmarks')
        .insert([maliciousBookmark])
    })

    it('removes XSS attack content', () => {
      return supertest(app)
        .get(`/bookmarks/${maliciousBookmark.id}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmakr.description)
        })
    })
  })

  describe('DELETE /bookmarks/:id', () => {
    context(`Given no bookmarks`, () => {
      it('responds with 404 when bookmark with that ID does not exist', () => {
      return supertest(app)
        .delete(`/bookmarks/invalidId`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(404, 'Not found')
      })
    })

    context('Given there are bookmarks in database', () => {
      const textBookmarks = fixtures.makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db 
          .into('bookmarks')
          .insert(testBookmarks)
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
  })

  describe('Bookmarks App', () => {
    it('GET / responds with 200 containing "Hello, world!"', () => {
      return supertest(app)
        .get('/')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200, 'Hello, world!')
    })
  })
})