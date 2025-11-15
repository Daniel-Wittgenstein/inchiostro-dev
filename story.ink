
<h1>CLOAK OF SILENCE</h1>

<h2>An Inchiostro Demo Game</h2>

+ START
-

$ ambient: example-game/rain.mp3

$ image: example-game/rain.jpg; alt = A person with an umbrella in the rain.

A rainy night.

You are on your way to the opera.

+ Keep walking.

    -> walk

+ Go back home.

  You are already half-ill, so you decide to walk home.

  -> game_over


=== game_over

THE END

-> DONE

=== walk

$ image: example-game/park.jpg; alt = A rainy night.;

Walking through the park.

You like the rain, you like the darkness.

+ Keep walking.

    Yeah, let's keep going.

+ Linger a bit.

    You've always liked the darkness.
    
    The sound of the rain.
    
    But you are getting wet.
    
    ++ Better keep walking.

-

-> DONE



