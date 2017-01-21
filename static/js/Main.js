import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';
import Game from './Game';
import TweetInput from './TweetInput';
import Store from 'store2';

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
      host: false,
      gameStarted: false,
      countdown: 3,
      isSelected: false,
      isReady: false,
      usersReady: [],
      usersPlaying: null
    }

    this.channelName = Store.get('channelName');
    this.channelName = 'testChannel001'
  }


  assignHost(presenceEvent){
    if (presenceEvent.action == "join"){
      console.log(presenceEvent.uuid + " has joined " + presenceEvent.channel)
    }
    // first one here is host
    if (presenceEvent.action == "join" && presenceEvent.occupancy == 1){

      console.log("You, " + presenceEvent.uuid + ", are Host.")
      this.setState({
        host: true,
        usersReady: []
      })

      this.pubnubDemo.setState({
        state: {
          "host": true,
          usersReady: []
        },
        uuid: this.pubnubDemo.getUUID(),
        channels: [this.channelName]
      })
    }

    //if host leaves, someone else takes over
    if (presenceEvent.action == "leave" || presenceEvent.action == "timeout"){
      console.log(presenceEvent.uuid + " has left.")
      console.log("Occupancy is now at ",presenceEvent.occupancy);
      console.log(presenceEvent)
      if (this.state.host) {
        var tempArray = this.state.usersReady
        var index = tempArray.indexOf(presenceEvent.uuid)
        if ( index > -1 ){
          tempArray.splice(index,1)
        }
        console.log(tempArray.toString() + " is ready")
        this.setState({
          host: this.state.host,
          usersReady: tempArray
        })

        this.pubnubDemo.setState({
          state: {
            host: this.state.host,
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
          console.log(presenceEvent.state)
          var tempArray = presenceEvent.state.usersReady
          var index = tempArray.indexOf(presenceEvent.uuid)
          if (index > -1){
            tempArray.splice(index,1)
          }
          console.log(tempArray.toString() + " is ready")
          this.setState({
            host: true,
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

    if(this.state.host && response.message.ready != null){
      var tempArray = this.state.usersReady
      tempArray.push(response.message.ready);
      console.log(tempArray.toString() + " is ready")
      this.setState({
        host: this.state.host,
        usersReady: tempArray
      });
      this.pubnubDemo.setState({
        state: {
          host: this.state.host,
          usersReady: tempArray
        },
        uuid: this.pubnubDemo.getUUID(),
        channels: [this.channelName]
      })
    }

    if(response.message.usersPlaying != null){
      console.log(response.message.usersPlaying.toString() + " are playing")
      this.setState({
        usersPlaying: response.message.usersPlaying
      });
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
    if(!this.state.host || !this.state.isReady)
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
      console.log(this.state.usersPlaying)
      this.setState({
        gameStarted: true,
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
          <Game isHost={this.state.isHost} usersPlaying={this.state.usersPlaying} gameStarted={this.state.gameStarted} pubnubDemo={this.pubnubDemo} channelName={this.channelName}/>
          <TweetInput />
        </div>
        )
    }
  }

  module.exports = Main;