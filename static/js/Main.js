import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';
import Game from './Game';
import TweetInput from './TweetInput';
import Store from 'store2';
import Axios from 'axios';

class Main extends React.Component{
  constructor(props) {
    super(props);
    // Binding this to all necessary methods
    this.getReady = this.getReady.bind(this);
    this.startCountdown = this.startCountdown.bind(this);
    this.gameStart = this.gameStart.bind(this);
    this.updateMessageOnListener = this.updateMessageOnListener.bind(this);

    // Instantiating a PubNub object
    this.pubnubDemo = new PubNub({
      publishKey: 'pub-c-89d8d3f5-9d58-4c24-94e7-1c89f243296a',
      subscribeKey: 'sub-c-99748e0e-df8d-11e6-989b-02ee2ddab7fe',
      uuid: PubNub.generateUUID(),
      presenceTimeout: 10,  // Check for users timing out faster
      heartbeatInterval: 5
    });

    // Initialize the state of Main (for each user)
    this.state = {
      host: false,  // Whether or not the user is the host of the channel/room
      gameStarted: false, // Whether or not the game has started
      countdown: 5, // Number of seconds to count down
      isReady: false, // Determines if the user is ready to play the game
      usersReady: [], // Array of all the users that are ready
      usersPlaying: null  // Array of users going to be playing in the game
    }

    // Channel or room that users will be subscribed to
    this.channelName = Store.get('channelName');
  }
  /*
   * Callback of element initialization
   */
  componentWillMount(){
    // Initialize state of pubnubDemo
    this.pubnubDemo.setState({
      state: {
        "host": false
      },
      uuid: this.pubnubDemo.getUUID(),
      channels: [this.channelName]
    });
    // Add listener to receive published messages
    this.pubnubDemo.addListener({
      message: this.updateMessageOnListener,
      presence: function(presenceEvent){
        this.assignHost(presenceEvent);
      }.bind(this)
    });

    // Subscribe to channel and turn on presence
    this.pubnubDemo.subscribe({
      channels: [this.channelName],
      withPresence: true
    });
  }

  // Callback function called when message is received by listener 
  updateMessageOnListener(response) {

    // Game start message
    if(response.message.game == "start_countdown"){
      if(this.state.isReady){
        console.log("People playing: ", response.message.usersPlaying);
        this.startCountdown();
      }
    }

    // When a user is ready, host adds user to array of users that are ready
    if(this.state.host && response.message.ready != null){
      var tempArray = this.state.usersReady;
      tempArray.push(response.message.ready); // Add new ready user
      console.log(tempArray.toString() + " is ready");
      // Update state
      this.setState({
        host: this.state.host,
        usersReady: tempArray
      });
      // Update pubnubDemo state
      this.pubnubDemo.setState({
        state: {
          host: this.state.host,
          usersReady: tempArray
        },
        uuid: this.pubnubDemo.getUUID(),
        channels: [this.channelName]
      });
    }

    // Update array of users playing
    if(response.message.usersPlaying != null){
      console.log(response.message.usersPlaying.toString() + " are playing")
      // Update state
      this.setState({
        usersPlaying: response.message.usersPlaying
      });
    }
  }
  // Assigns host to a user in the room / channel. Host holds certain room info
  // and is the only one that can start the game
  assignHost(presenceEvent){

    // Display when a user has joined
    if (presenceEvent.action == "join"){
      console.log(presenceEvent.uuid + " has joined " + presenceEvent.channel)
    }
    // First one here is host
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
  getReady() {
    if(!this.state.isReady){
      Axios.get('/redirect_to_auth', {
        params: {
          ID: this.pubnubDemo.getUUID()
        }
      })
      .then(function (response){
        console.log(response);
      })
      .catch(function (error){
        console.log(response);
      });
      
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
          // console.log("message Published w/ timetoken", response.timetoken);
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
    const buttonCSS = ClassNames({
      'btn': true, 
      'btn-default': true,
      'Button': true,
      'is-ready': this.state.isReady ? true : false
    });

    const countdownCSS = ClassNames({
      'should-hide': this.state.gameStarted ? true : false
    })

    return (
      <div className='Index container'>
        <div style={{display: (!this.state.gameStarted ? "block" : "none")}}>
          <p className={countdownCSS + " countdown-label"}>
            Countdown
          </p>
          <p className={countdownCSS + " countdown-number"}>
            {this.state.countdown}
          </p>

          <button type="button" onClick={this.getReady}
                  className={buttonCSS + ' ready-button'}>
            {this.state.isReady ? "Ready" : "Not Ready Yet"}
          </button>
          <button type="button" onClick={this.gameStart}
                  className={buttonCSS + ' start-button'}>
            Start game
          </button>
        </div>

        <Game isHost={this.state.isHost} usersPlaying={this.state.usersPlaying} gameStarted={this.state.gameStarted} pubnubDemo={this.pubnubDemo} channelName={this.channelName}/>
        <TweetInput />
      </div>
      )
    }
  }

  module.exports = Main;