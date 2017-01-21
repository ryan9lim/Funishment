import Hello from './Hello';
import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';

class Main extends React.Component{
  constructor(props) {
    super(props);
    this.clickButton = this.clickButton.bind(this);
    this.callMeBack = this.callMeBack.bind(this);
    this.pubnubDemo = new PubNub({
      publishKey: 'pub-c-89d8d3f5-9d58-4c24-94e7-1c89f243296a',
      subscribeKey: 'sub-c-99748e0e-df8d-11e6-989b-02ee2ddab7fe'
    });
    this.state = {
      uuid: Math.floor(Math.random() * 256),
      isSelected: false
    }
  }
  callMeBack(status, response) {
    if (status.error) {
      console.log(status);
    } else {
      console.log("message Published w/ timetoken", response.timetoken, this.state.uuid.toString() );
    }
  }
  componentWillMount(){
    this.pubnubDemo.publish(
    {
      message: {
        user: this.state.uuid.toString()
      },
      channel: 'testChannel'
    },
      this.callMeBack
    );
    this.pubnubDemo.addListener({
      message: function(message){
        console.log(message);
      }
    })
    this.pubnubDemo.subscribe({
      channels: ['testChannel']
    })
  }
  clickButton() {
    var random = Math.floor(Math.random() * 2);
    if (random == 0) {
      this.pubnubDemo.publish(
      {
        message: {
          buttonPressed: 'true',
          targetUser: 'friend'
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
      } else {
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
      }

      this.setState({
        isSelected: this.state.isSelected ? false : true
      });
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
        <button type="button"
                onClick={this.clickButton}
                className={cssClasses}>
          Click on button
        </button>
        )
      }
    }

    module.exports = Main;