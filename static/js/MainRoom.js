import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';
import Store from 'store2';
import Axios from 'axios';

class MainRoom extends React.Component{
  constructor(props) {
    super(props);
  }
  componentWillMount() {
    {/*console.log('Mounting');
    Axios.get('/redirect_to_auth')
         .then((resp) => {console.log(resp);})
         .catch((err) => {console.log(err );});*/}
  }
  render() {
    return (
      <div className='Room'>
        <div className='container'>
          <p className='title'>Funishment</p>
          <ChannelForm />
          <ChannelList />
        </div>
      </div>
    )
  }
}

class ChannelForm extends React.Component {
  constructor(props) {
    super(props);
    this.onAddChannel = this.onAddChannel.bind(this);
    this.state = {
      channelName: ''
    }
  }
  onAddChannel(event) {
    event.preventDefault();
    this.setState({
      channelName: this.refs.inputText.value
    });
    Store('channelName', this.refs.inputText.value);
    window.location = '/';
  }
  render() {
    return (
      <div className="ChannelForm">
        <form onSubmit={this.onAddChannel}>
          <input type="text" className="form-control" id="test"
                 placeholder="Ryan's Magical Palace" 
                 ref="inputText"
                 aria-describedby="basic-addon1"/>
          <button type="submit" className="btn btn-md btn-default">
            Create Channel
          </button>
        </form>
      </div>
    )
  }
}

class ChannelList extends React.Component {
  constructor(props) {
    super(props);
    this.pubnubDemo = new PubNub({
      publishKey: 'pub-c-89d8d3f5-9d58-4c24-94e7-1c89f243296a',
      subscribeKey: 'sub-c-99748e0e-df8d-11e6-989b-02ee2ddab7fe',
      presenceTimeout: 10,
      heartbeatInterval: 5
    });
    this.state = {
      channelList: [],
      occupancyList: []
    }
  }
  componentWillMount(){
    this.pubnubDemo.hereNow({
      includeState: true,
      includeUUIDs: true
    },
    function(status, response){
      var tempArray = [];
      var tempArray2 = []
      var channel;
      console.log(response);
      for (channel in response.channels){
        tempArray.push(channel)
        tempArray2.push(response.channels[channel].occupancy)
      }
      this.setState({
        channelList: tempArray,
        occupancyList: tempArray2
      })
    }.bind(this));
  }
  goToChannel(name, event) {
    event.preventDefault();
    this.setState({
      channelName: name
    });
    Store('channelName', name);
    window.location = '/';
  }
  render() {
      return (
        <div className='ChannelList'>
          <h3> Current Active Channels </h3>
          {this.state.channelList.map((name, index) => 
              (<button onClick= {this.goToChannel.bind(this, name)}
                className='btn btn-lg btn-default' key={index}>
                {name}<br />{'Occupancy: '+this.state.occupancyList[index]}
              </button>)
          )}
        </div>
      )
  }
}

module.exports = MainRoom;  