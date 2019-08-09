const express = require('express');
const uuid = require('uuid/v4');
const { isWebUri }= require('valid-url');
const logger = require('../logger');
const { bookmarks } = require('../store');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks);
    })
    .post(bodyParser, (req, res) => {
        const { title, url, description, rating } = req.body;

    if (!title) {
        logger.error(`A title is required`);
        return res
          .status(400)
          .send('Invalid data');
      }

    if (!url) {
        logger.error(`The URL is required`);
        return res
          .status(400)
          .send('Invalid data');
    }

    if (!rating) {
        logger.error(`A rating is required`);
        return res
          .status(400)
          .send('Invalid data');
    }

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
        logger.error(`Invalid rating ${rating}.`);
        return res
            .status(400)
            .send('Rating must be an integer between 0 and 5.')
    }

    if (!isWebUri(url)) {
        logger.error(`Invalid url ${url}`);
        return res
            .status(400)
            .send('URL must be valid.')
    }

    const id = uuid();
    const bookmark = {
        id,
        title,
        url,
        description,
        rating
    }
    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} created`);

    res
        .status(201)
        .location(`http://localhost:8000/bookmarks/${id}`)
        .json(bookmark);
    });

bookmarkRouter
    .route('/bookmarks/:bookmarkId')
    .get((req, res) => {
        const { bookmarkId } = req.params;
        const bookmark = bookmarks.find(c => c.id == bookmarkId);

        if(!bookmark) {
        logger.error(`Bookmark with id ${bookmarkId} is not found.`);
        return res
            .status(404)
            .send('That bookmark was not found.');
        }

        res.json(bookmark);
    })
    .delete((req, res) => {
        const { id } = req.params;
        const bookmark = bookmarks.find(b => b.id == id);
        const bookmarkIds = bookmarks.map(bm => bm.id);

        if(!bookmarkIds.includes(id)) {
            logger.error(`Bookmark with id ${id} was not found.`);
            return res
                .status(404)
                .send('Not found');
        };

        bookmarks.splice(bookmark, 1);
        logger.info(`Bookmark with id ${id} deleted.`);
        res
            .status(204)
            .end();
    });

module.exports = bookmarkRouter;