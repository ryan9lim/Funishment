import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';
import Axios from 'axios';
import OauthSignature from 'oauth-signature';

{/*
  Props available to TweetInput:

*/}

class TweetInput extends React.Component {
  constructor(props) {
    super(props);
    this.authorizeApp = this.authorizeApp.bind(this);
    this.getNonce = this.getNonce.bind(this);

    this.state = {
      signature: ''
    }
  }
  componentWillMount() {
    this.authorizeApp();
  }
  getNonce(length) {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  authorizeApp() {
    const httpMethod = 'POST';
    let params = {
      oauth_consumer_key: "76SV33OlqPJuhkTrnDMLyWX1w",
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_nonce: this.getNonce(30)       
    };
    const url = 'https://api.twitter.com/oauth/request_token';
    const consumerSecret = 'jJvL67e6IgCKjinU3weCvr1AiiYBQXsBwTRJ2hiv3jB8ZlSN76';
    const signature = 
      OauthSignature.generate(httpMethod, url, params, consumerSecret);
    params['signature'] = signature;

    this.setState({
      signature: signature
    })

    // Axios.request({
    //   url: url,
    //   method: httpMethod.toLowerCase(),
    //   auth: params,
    //   headers: {'Access-Control-Allow-Origin': '*'}
    // })
    // .then((response) => {console.log(response);})
    // .catch((err) => {console.log(err);});

    // Axios.post('https://api.twitter.com/oauth/request_token', {
    // })
    // .then((response) => {
    //   {/*console.log(response);*/}
    //   this.setState({
    //     chartList: response.data.chartList,
    //     labelList: this.state.selectedComparison === 'region' ? 
    //                response.data.labelList : [],
    //     selectedLabelList: this.state.selectedComparison === 'region' ? 
    //                        response.data.labelList.slice(0,1) : []
    //   });
    // })
    // .catch((err) => {console.log(err);});  
  }
  render() {
    return (
      <div className='TweetInput'>
      </div>
    )
  }
}

module.exports = TweetInput;