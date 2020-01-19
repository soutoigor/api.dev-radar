const axios = require('axios')
const Dev = require('../models/Dev')
const { findConnections, sendMessage } = require('../websocket')

module.exports = {
  async index(req, res) {
    const devs = await Dev.find()
    return res.json(devs)
  },
  async store(req, res) {
    const {
      github_username,
      techs,
      longitude,
      latitude,
    } = req.body

    const duplicatedDev = await Dev.findOne({ github_username })

    if (duplicatedDev) return res.status(400).send('User has already been created!')
 
    const techsArray = techs.replace(' ', '').split(',')

   const { 
      data: {
        name = login,
        avatar_url,
        bio,
      }
    } = await axios.get(`https://api.github.com/users/${github_username}`)
  
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    }
    
    const dev = await Dev.create({
      github_username,
      name,
      avatar_url,
      bio,
      techs: techsArray,
      location,
    })

    const sendSocketMessageTo = findConnections(
      {
        latitude,
        longitude,
      },
      techsArray,
    )

    sendMessage(sendSocketMessageTo, 'new-dev', dev)
  
    return res.json(dev)
  }
}