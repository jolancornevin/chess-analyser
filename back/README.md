A backend server that simply runs stockfish analysis

It's heavily inspired by https://github.com/notnil/chess/tree/master/uci which already handles talking to stockfish

I've simply added the HTTP server part + made a few fixes to work with the front and support the WDL.

The goal of this is to release some load from the front + be able to // the analysis queries.

It will also be easier to scale for faster analysis
