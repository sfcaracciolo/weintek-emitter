var events = require('events')

class WeintekEmitter extends events.EventEmitter {
    constructor(family) {
        super()
        this.config = family.config
        this.driver = family.driver

        this.on('warning', err => {
            console.log('Info: ' + err.message)
        })

        this.on('send', buffer => {
            this.writeIOBuffer(buffer, err => {
                if (err) this.emit('warning', err)
            })
        })

        this.on('error', (err) => {
            console.error (err.message);
            this.driver.setData(this.config.ERROR, 1, err => {
                if (err) this.emit('warning', err)
            });
        })

        this.config.TRIGGER.onResponse( (err, data) => {
            
            if (err) return this.emit('warning', err)

            this.driver.getData(this.config.IS_TRAP, 1, (err, data) => {
                if (err) return this.emit('warning', err)
                var is_trap = data.values[0]
                if (is_trap) return this.emit('trap')
                else {
                    this.readIOBuffer((err, data) => {
                        if (err) return this.emit('warning', err)
                        this.emit('message', data, undefined) // msg, rinfo=undefined
                    })
                }
            })
            
        } ); 
    }

    readIOBuffer(callback){
        this.driver.getData(this.config.IO_BUFFER_LEN, 1, (err, data) => { 

            if (err) return callback(err, undefined)

            if (data.values[0] === 0) return callback(Error('IO Buffer size is zero.'), undefined)

            var blen = data.values[0]
            var wlen = Math.ceil(blen/2); // len in words

            this.driver.getData(this.config.IO_BUFFER, wlen, (err, data) => {
                if (err) return callback(err, undefined)
                callback(undefined, Buffer.alloc(blen, data.buffer)) // Buffer.from is required because the dgram module depend on node:buffer, but in this project must be use buffer (browserly) to compat with JSEngine of the HMI
            });
        });
    };

    writeIOBuffer(buffer, callback){
        var blen = buffer.length
		var nblen = (blen % 2 == 0 ) ? blen : blen + 1
		var nbuffer = Buffer.alloc(nblen, buffer)
		var values = new Array(nblen/2)
		for (let i=0; i < blen; i=i+2) {
			values[i/2] = nbuffer.readUInt16LE(i);
		}

        this.driver.setData(this.config.IO_BUFFER_LEN, blen, err => {
            if (err) return callback(err)
            this.driver.setData(this.config.IO_BUFFER, values, err => {
                if (err) return callback(err)
                this.driver.setData(this.config.READY, 1, err => {
                    if (err) return callback(err)
                })
            });
        });
    };

    static createSocket(family) {
        return new WeintekEmitter(family)
    }
}


module.exports = WeintekEmitter