const User = require('../models').User;

module.exports = {
    create(req, res) {
      return User
          .create({
              username: req.body.username,
              password: req.body.password
          })
          .then(user => res.status(201).send(user))
          .catch(error => res.status(400).send(error))
    },
    list(req, res) {
        return User
            .findAll()
            .then(users => res.status(200).send(users))
            .catch(error => res.status(400).send(error))
    },
    retrieve(req, res) {
        return res.status(200).send("user id : [" + req.params.userId + "]" );
    }
}