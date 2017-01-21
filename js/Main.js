import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';
import Game from './Game';

class Main extends React.Component{
  constructor(props) {
    super(props);
    this.getReady = this.getReady.bind(this);
    this.startCountdown = this.startCountdown.bind(this);
    this.gameStart = this.gameStart.bind(this);
    this.updateMessageOnListener = this.updateMessageOnListener.bind(this);
    this.pubnubDemo = new PubNub({
      publishKey: 'pub-c-89d8d3f5-9d58-4c24-94e7-1c89f243296a',
      subscribeKey: 'sub-c-99748e0e-df8d-11e6-989b-02ee2ddab7fe',
      uuid: PubNub.generateUUID(),
      presenceTimeout: 10,
      heartbeatInterval: 5
    });
    this.state = {
      isHost: false,
      gameStarted: false,
      countdown: 3,
      isSelected: false,
      isReady: false,
      usersReady: []
    }

    this.channelName = 'testChannel21'
  }


  assignHost(presenceEvent){
    if (presenceEvent.action == "join"){
      console.log(presenceEvent.uuid + " has joined.")
    }
    // first one here is host
    if (presenceEvent.action == "join" && presenceEvent.occupancy == 1){

      console.log("You, " + presenceEvent.uuid + ", are Host.")
      this.setState({
        isHost: true
      })

      this.pubnubDemo.setState({
        state: {
          "host": true
        },
        uuid: this.pubnubDemo.getUUID(),
        channels: [this.channelName]
      })
    }

    //if host leaves, someone else takes over
    if (presenceEvent.action == "leave" || presenceEvent.action == "timeout"){
      console.log(presenceEvent.uuid + " has left.")
      console.log("Occupancy is now at ",presenceEvent.occupancy);
      if (this.state.isHost) {
          if ((index = tempArray.indexOf(presenceEvent.uuid)) > -1){
            tempArray.splice(index,1)
          }
          this.setState({
            usersReady: tempArray
          })

          this.pubnubDemo.setState({
            state: {
              usersReady: tempArray
            },
            uuid: this.pubnubDemo.getUUID(),
            channels: [this.channelName]
          })
      }
    }
    if ((presenceEvent.action == "leave" || presenceEvent.action == "timeout") && presenceEvent.state.host == true){
      console.log(presenceEvent.uuid + " is no longer Host.")
      this.pubnubDemo.hereNow({
        channels : [this.channelName],
        includeUUIDs: true,
        includeState: true
      },
      function(status,response){
        if(response.channels[this.channelName].occupants[0].uuid == this.pubnubDemo.getUUID()) {
          console.log("You, "+ presenceEvent.uuid + ", are Host.")
          var tempArray = presenceEvent.state.usersReady
          if ((index = tempArray.indexOf(presenceEvent.uuid)) > -1){
            tempArray.splice(index,1)
          }
          this.setState({
            isHost: true,
            usersReady: tempArray
          })

          this.pubnubDemo.setState({
            state: {
              "host": true,
              usersReady: tempArray
            },
            uuid: this.pubnubDemo.getUUID(),
            channels: [this.channelName]
          })
        } else {
          console.log(response.channels[this.channelName].occupants[0].uuid + " is Host.")
        }
      }.bind(this))
    }
  }
  /*
   * Callback of element initialization
   */
   componentWillMount(){
    this.pubnubDemo.setState({
        state: {
          "host": false
        },
        uuid: this.pubnubDemo.getUUID(),
        channels: [this.channelName]
      })
    this.pubnubDemo.addListener({
      message: this.updateMessageOnListener,
      presence: function(presenceEvent){
        this.assignHost(presenceEvent);
      }.bind(this)
    })
    this.pubnubDemo.subscribe({
      channels: [this.channelName],
      withPresence: true
    })
  }

  updateMessageOnListener(response) {
    // GAME IS STARTING
    if(response.message.game == "start_countdown"){
      if(this.state.isReady){
        console.log("People playing: ", response.message.usersPlaying);
        this.startCountdown();
      }
    }

    if(this.state.isHost && response.message.ready != null){
      var tempArray = this.state.usersReady
      tempArray.append(response.message.ready);
      this.setState({
        usersReady: tempArray
      });
      this.pubnubDemo.setState({
        state: {
          usersReady: tempArray
        },
        uuid: this.pubnubDemo.getUUID(),
        channels: [this.channelName]
      })
    }
  }
   getReady() {
    if(!this.state.isReady){
      this.pubnubDemo.publish(
      {
        message: {
          ready: this.pubnubDemo.getUUID()
        },
        channel: this.channelName
      },
      function (status, response) {
        if (status.error) {
          console.log(status);
        } else {
          console.log("message Published w/ timetoken", response.timetoken);
        }
      }
      );
      this.setState({
        isReady: true
      });
    }

    // TODO: Do the following only if all users are in
    //this.startCountdown();
    }
    gameStart() {
      if(!this.state.isHost)
        return
      this.pubnubDemo.publish(
      {
        message: {
          game: 'start_countdown',
          usersPlaying: this.state.usersReady
        },
        channel: this.channelName
      },
      function (status, response) {
        if (status.error) {
          console.log(status);
        } else {
          console.log("message Published w/ timetoken", response.timetoken);
        }
      }
      );
    }
    startCountdown() {
      if (this.state.countdown <= 0) {
        console.log("GAME IS STARTING");
        this.setState({
          gameStarted: true
        })
      } else {
        this.setState({
          countdown: this.state.countdown - 1
        });
        setTimeout(this.startCountdown, 1000); // check again in a second
      }
    }
    render() {
      const cssClasses = ClassNames({
        'btn': true, 
        'btn-lg': true, 
        'btn-default': true,
        'Button': true,
        'is-selected': this.state.isSelected
      });

      return (
        <div className='Index'>
          <button type="button"
          onClick={this.getReady}
          className='btn btn-lg btn-default'>
          Ready
          </button>
          <button type="button"
          onClick={this.gameStart}
          className='btn btn-lg btn-default'>
          Start game
          </button>
          <h1> {this.state.isReady ? "READY" : "NOT READY YET"} </h1>
          <h1 style={{display: (this.state.gameStarted ? "none" : "block")}}> COUNTDOWN: {this.state.countdown} </h1>
          <Game gameStarted={this.state.gameStarted}/>
        </div>
        )
      }
    }

    module.exports = Main;