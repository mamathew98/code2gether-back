const express = require('express');
const router = express.Router();
const docService = require('./document.service');

module.exports = router;

router.post('/createdoc', createDoc);
router.post('/deletedoc', deleteDoc);

router.get('/', getAllDocs);
router.get('/:id', getDocById);
router.get('/user/:username', getUserDocs);
router.put('/:id', saveDoc);
// router.post('/:id', deleteDoc);

function createDoc(req, res, next) {
    docService.createDoc(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function saveDoc(req, res, next) {
    docService.saveDoc(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAllDocs(req, res, next) {
    docService.getAllDocs()
        .then(docs => res.json(docs))
        .catch(err => next(err));
}

function getUserDocs(req, res, next) {
    docService.getUserDocs(req.params.username)
        .then(docs => res.json(docs))
        .catch(err => next(err));
}

function getDocById(req, res, next) {
    docService.getDocById(req.params.id)
        .then(doc => res.json(doc))
        .catch(err => next(err));
}

function deleteDoc(req, res, next) {
    console.log('remove ctrl')
    docService.deleteDoc(req.body.username ,req.body.pid)
        .then(() => res.json({}))
        .catch(err => next(err));
}