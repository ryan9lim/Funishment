from __future__ import print_function
from flask import Flask, session, render_template, request, redirect, make_response, Response
from requests_oauthlib import OAuth1
import os, json
import requests, requests_oauthlib
from twython import Twython, TwythonError
import webbrowser

app = Flask(__name__)
APP_KEY = '76SV33OlqPJuhkTrnDMLyWX1w'
APP_SECRET = 'jJvL67e6IgCKjinU3weCvr1AiiYBQXsBwTRJ2hiv3jB8ZlSN76'
tDict = dict()
userID = ''
AUTH_OAUTH_TOKEN = ''
AUTH_OAUTH_TOKEN_SECRET = ''
AUTH_OAUTH_VERIFIER = ''
USER_OAUTH_TOKEN = ''
USER_OAUTH_TOKEN_SECRET = ''

@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/room')
def serve_room():
    return render_template('room.html')

@app.route('/redirect_to_auth', methods=['GET'])
def redirect_to_auth():
    global APP_KEY, APP_SECRET, AUTH_OAUTH_TOKEN, AUTH_OAUTH_TOKEN_SECRET, userID

    twitter = Twython(APP_KEY, APP_SECRET)
    print('created twitter object')
    auth = twitter.get_authentication_tokens(callback_url='http://0.0.0.0:5000/twitter_auth')
    print('got authentication tokens')

    userID = request.args['ID']

    print(userID)

    AUTH_OAUTH_TOKEN = auth['oauth_token']
    AUTH_OAUTH_TOKEN_SECRET = auth['oauth_token_secret']
    auth_url = auth['auth_url']
    print(AUTH_OAUTH_TOKEN)
    print(AUTH_OAUTH_TOKEN_SECRET)

    webbrowser.open(auth['auth_url'])
    make_response()

@app.route('/twitter_auth', methods=['GET'])
def serve_twitter_auth():
    global APP_KEY, APP_SECRET, AUTH_OAUTH_TOKEN, AUTH_OAUTH_TOKEN_SECRET, AUTH_OAUTH_VERIFIER, USER_OAUTH_TOKEN, USER_OAUTH_TOKEN_SECRET, tDict

    oauth_token = request.args['oauth_token']
    AUTH_OAUTH_VERIFIER = request.args['oauth_verifier']

    print(oauth_token)
    print(AUTH_OAUTH_VERIFIER)

    twitter = Twython(APP_KEY, APP_SECRET, 
                      AUTH_OAUTH_TOKEN, 
                      AUTH_OAUTH_TOKEN_SECRET)

    print('created twitter')

    final_step = twitter.get_authorized_tokens(AUTH_OAUTH_VERIFIER)

    print('got authorized user tokens')

    USER_OAUTH_TOKEN = final_step['oauth_token']
    USER_OAUTH_TOKEN_SECRET = final_step['oauth_token_secret']

    tDict[userID] = [USER_OAUTH_TOKEN, USER_OAUTH_TOKEN_SECRET]

    print(USER_OAUTH_TOKEN)
    print(USER_OAUTH_TOKEN_SECRET)

    twitter = Twython(APP_KEY, APP_SECRET,
                      USER_OAUTH_TOKEN,
                      USER_OAUTH_TOKEN_SECRET)

    print('Created user twitter object')

    return Response(response={'status_code': 200},
                    status=200,
                    mimetype='application/json')

@app.route('/post_status', methods=['GET'])
def post_Twitter_Status():
    global APP_KEY, APP_SECRET, AUTH_OAUTH_TOKEN, AUTH_OAUTH_TOKEN_SECRET, AUTH_OAUTH_VERIFIER, tDict

    print("we made it hellllooooo")
    user = request.args['ID']
    message = request.args['message']
    print(user)
    print(message)

    twitter = Twython(APP_KEY, APP_SECRET,
                      tDict[user][0],
                      tDict[user][1])

    try:
        twitter.update_status(status=message)
    except TwythonError as e:
        print(e)

    return Response(response={'status_code': 200},
                    status=200,
                    mimetype='application/json')


if __name__ == '__main__':
    app.run(debug=True)
    # main()
