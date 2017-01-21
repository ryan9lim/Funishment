from __future__ import print_function
from flask import Flask, render_template, request, redirect, make_response, Response
from requests_oauthlib import OAuth1
import os, json

app = Flask(__name__)

def main():
    print(3)
    # url = 'https://api.twitter.com/oauth/request_token'
    # auth = OAuth1(API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET)
    # requests.get(url, auth=auth)


@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/room')
def serve_room():
    return render_template('room.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)    
    # main()