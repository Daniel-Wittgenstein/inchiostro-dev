$ muteApp


VAR location = "Walking"
VAR cloakText = "(no cloak)"
VAR has_cloak = false

// Enable custom save slot texts:
VAR saveSlotText = ""
~ saveSlotText = "&(location) &(cloakText)"



// After selecting a choice, do not print its choice text again:
$ hideChoiceText


<h1>CLOAK OF SILENCE</h1>

<h2>An Inchiostro Demo Game</h2>

+ START
-

$ ambient: example-game/rain.mp3

$ image: example-game/rain.jpg; alt = A person with an umbrella in the rain.

A rainy night.

You are on your way to the opera.

+ Keep walking.

    -> in_front

+ Go back home.

    ~ location = "At Home"

    You are already half-ill, so you decide to walk home.

    -> game_over



=== game_over

THE END

-> DONE



=== in_front

$ ambient: example-game/rain.mp3

~ location = "in front of the opera"
    
$ image: example-game/opera.jpg; alt = Dresden opera house.

In front of the opera.

+ Enter
    -> foyer



=== foyer

~ location = "Foyer"

$ ambient: example-game/inside.mp3

$ image: example-game/bar.jpg

You are in the foyer of the opera house.

+ Go out
    -> in_front





-> DONE



