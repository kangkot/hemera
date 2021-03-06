'use strict'

describe('Hemera-mail', function () {
  const PORT = 6243
  const flags = ['--user', 'derek', '--pass', 'foobar']
  const authUrl = 'nats://derek:foobar@localhost:' + PORT
  let server
  let HemeraMail
  let HemeraJoi

  // Start up our own nats-server
  before(function (done) {
    if (NodeVersion.major < 6) {
      return this.skip()
    }

    HemeraMail = require('../../packages/hemera-mail')
    HemeraJoi = require('../../packages/hemera-joi')

    server = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    if (NodeVersion.major < 6) {
      return this.skip()
    }

    server.kill()
  })

  it('Should be able to send an email', function (done) {
    const nats = require('nats').connect({
      url: authUrl
    })

    const hemera = new Hemera(nats, {
      logLevel: 'info'
    })

    hemera.use(HemeraJoi)
    hemera.use(HemeraMail)

    hemera.ready(() => {
      const message = {
        from: 'sender@server.com',
        to: 'receiver@sender.com',
        subject: 'Message title',
        text: 'Plaintext version of the message',
        html: '<p>HTML version of the message</p>'
      }
      hemera.act({
        topic: 'mail',
        cmd: 'send',
        message
      }, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp.messageId).to.be.exists()
        expect(resp.envelope).to.be.exists()
        hemera.close()
        done()
      })
    })
  })

  it('Should not be able to send without subject', function (done) {
    const nats = require('nats').connect({
      url: authUrl
    })

    const hemera = new Hemera(nats)

    hemera.use(HemeraJoi)
    hemera.use(HemeraMail)

    hemera.ready(() => {
      const message = {
        from: 'sender@server.com',
        to: 'receiver@sender.com',
        // subject: 'Message title',
        text: 'Plaintext version of the message',
        html: '<p>HTML version of the message</p>'
      }
      hemera.act({
        topic: 'mail',
        cmd: 'send',
        message
      }, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.name).to.be.equals('PreValidationError')
        hemera.close()
        done()
      })
    })
  })
})
