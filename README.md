# Funishment

Funishment is a real-time multiplayer full-stack card game along with Twitter integration. 
It allows for multiple simultaneous games in different custom-named channels. 

Players start by either creating their own room or joining a preexisting room, and then playing the card game, "Yusef," among the other players in the room. Before starting though, players must allow permissions for the game to post on their Twitter account. The game of Yusef can be read here: http://www.rockmusiclist.com/gyusef.htm. There is only one loser in Yusef, and the winners of the game get to post one tweet to the loser's Twitter account.

Funishment was built using ReactJS and PubNub's Publish/Subscribe model. We used the publish/subscribe model to buid a turn-based game with multiple channels/rooms. 


#How to build and run the app:

On terminal:

1. Leave one tab running 'webpack --watch'
2. Leave one tab running 'python app.py'

The index page is hosted at 'localhost:8080/'
The room page is hosted at 'localhost:8080/room'

Start off by going to 'localhost:8080/room' first.

If there are new Javascript libraries and/or Python modules to install, run:

1. npm install -g webpack
2. npm install
3. pip install -r requirements.txt
