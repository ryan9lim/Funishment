import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';

class Main extends React.Component{
  constructor(props) {
    super(props);
    this.clickButton = this.clickButton.bind(this);
    this.getReady = this.getReady.bind(this);
    this.startCountdown = this.startCountdown.bind(this);
    this.gameStart = this.gameStart.bind(this);
    this.updateMessageOnListener = this.updateMessageOnListener.bind(this);
    this.pubnubDemo = new PubNub({
      publishKey: 'pub-c-89d8d3f5-9d58-4c24-94e7-1c89f243296a',
      subscribeKey: 'sub-c-99748e0e-df8d-11e6-989b-02ee2ddab7fe',
      uuid: PubNub.generateUUID(),
      presenceTimeout: 10
    });
    this.state = {
      score: 0,
      gameStarted: false,
      countdown: 3,
      isSelected: false,
      isReady: false,
      totalReady: 0,
      highTime: 0,
      clicked: false,
      cleared: false
    }
  }
  /*
   * Callback of element initialization
   */
   componentWillMount(){
    this.pubnubDemo.addListener({
      message: this.updateMessageOnListener,
      presence: this.updatePresence
    })
    this.pubnubDemo.subscribe({
      channels: ['testChannel'],
      withPresence: true
    })
  }
  updateMessageOnListener(response) {
    if (response.message.newCount != null) {
      console.log("response is", response);
      console.log("my own uuid is", this.pubnubDemo.getUUID());
      console.log("found a new count and it is", response.message.newCount);
      if(response.message.uuid != this.pubnubDemo.getUUID()) {
        console.log("opponent clicked");
        if (Math.abs(response.timetoken - this.state.highTime) < 50000000) {
          if (!this.state.cleared) {
            this.pubnubDemo.publish(
            {
              message: {
                buttonPressed: 'true',
                targetUser: 'friend',
                newCount: 0,
                uuid: this.pubnubDemo.getUUID()
              },
              channel: 'testChannel'
            });
            this.setState({
              cleared: true,
              score: 0,
              highTime: response.timetoken
            });
          }
        } else {
          this.setState({
            score: response.message.newCount,
            highTime: response.timetoken
          });
        }
      } else {
        this.setState({
          highTime: response.timetoken
        });
      }
    }

    if(response.message.game == "start"){
      if(this.state.isReady){
        console.log("Total people playing: ", this.state.totalReady);
        this.startCountdown();
      }
    }

    if (response.message.readyCount != null) {
      this.setState({
        totalReady: response.message.readyCount
      })
      console.log("total ready: ", response.message.readyCount);
    }
    // var component = this;
    // this.pubnubDemo.hereNow(
    // {
    //   channels: ["testChannel"],
    //   includeUUIDs: true,
    //   includeState: true
    // },
    // function (status, response) {
    //   console.log("hello", response);
    //   if(component.state.totalReady == response.totalOccupancy){
    //     console.log("hihireadytogo");
    //     component.startCountdown();
    //   }
    //   else{
    //     console.log("Not everyone is ready yet, occupancy is ", response.totalOccupancy);
    //   }
    // });

    console.log(response.message);
  }
  updatePresence(presenceEvent) {
    if(presenceEvent.action == "timeout"){
      console.log("Occupancy is now at ",presenceEvent.occupancy);
    }
    if(presenceEvent.action == "leave"){
      console.log("Occupancy is now at ",presenceEvent.occupancy);
    }
    // if(this.state.totalReady == presenceEvent.occupancy){
    //   console.log("hihireadytogo");
    //   this.startCountdown();
    // }
  }
  /*
   * Main button of game clicked
   */
   clickButton() {
    // var random = Math.floor(Math.random() * 2);

    // Win
    // if (random == 0) {
    // if(!this.state.gameStarted)
    //   return;
    if(!this.state.clicked && this.state.gameStarted) {
      this.pubnubDemo.publish(
      {
        message: {
          buttonPressed: 'true',
          targetUser: 'friend',
          newCount: this.state.score + 1,
          uuid: this.pubnubDemo.getUUID()
        },
        channel: 'testChannel'
      },
      function (status, response) {
        if (status.error) {
          console.log(status);
        } else {
          console.log("message Published w/ timetoken", response.timetoken);
        }
      }
      );
        // Post to friend's Twitter
      /* } else {
        // Lose
        this.pubnubDemo.publish(
        {
          message: {
            buttonPressed: 'true',
            targetUser: 'me'
          },
          channel: 'testChannel'
        },
        function (status, response) {
          if (status.error) {
            console.log(status);
          } else {
            console.log("message Published w/ timetoken", response.timetoken);
          }
        }
        );
        // Friend posts to your Twitter
      }*/

      this.setState({
        score: this.state.score + 1,
        clicked: true,
        isSelected: this.state.isSelected ? false : true
      });
    }
  }
    /*
     * Send start message to the channel
     */
     getReady() {
      if(!this.state.isReady){
        this.pubnubDemo.publish(
        {
          message: {
            buttonPressed: 'true',
            readyCount: this.state.totalReady + 1
          },
          channel: 'testChannel'
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
      this.pubnubDemo.publish(
      {
        message: {
          game: 'start'
        },
        channel: 'testChannel'
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
          onClick={this.clickButton}
          className='btn btn-lg btn-default'>
          Click on button
          </button>
          <button type="button"
          onClick={this.gameStart}
          className='btn btn-lg btn-default'>
          Start game
          </button>
          <h1> {this.state.isReady ? "READY" : "NOT READY YET"} </h1>
          <h1> COUNTDOWN: {this.state.countdown} </h1>
          <h1> Current Score: {this.state.score} </h1>
          <h1> Most Recent Time: {this.state.highTime} </h1>
          <h1> {this.state.clicked ? "CLICKED" : "NOT YET CLICKED"} </h1>
        </div>
        )
      }
    }

    module.exports = Main;