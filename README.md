# chess-analyser
A centipawn is equal to 1/100 of a pawn.

## Description
Get all your chess.com games of the month and get a review on it, with easy visualization of the engines lines.
All moves are classified as good or not, depending on the engine analysis.

In the back, each position is saved with it's analysis. This allows faster game review and it will open
multiple features like typical positions, puzzle from games, typical lost or wins, etc.

# Ressources
- UI: https://github.com/lichess-org/chessground
- Validation: https://github.com/jhlywa/chess.js
- Engine: https://github.com/nmrugg/stockfish.js
  - UCI: https://backscattering.de/chess/uci/#gui-debug
  - UCI for SF: https://github.com/official-stockfish/Stockfish/wiki/UCI-&-Commands


- How to compute %accuracy: https://lichess.org/page/accuracy
- How to classify moves: https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-and-etc

## Inspiration
### Articles
- https://github.com/crkco/Chess.com-Redesign-of-Nibbler-GUI
- https://github.com/ml-research/liground?tab=readme-ov-file

### Examples of interfaces
- https://www.chesscompass.com/analyze
- https://lichess.org/TDsWlO7Q/white#33
- https://app.decodechess.com/?_ga=2.69605718.733081154.1720613339-1977724414.1720613339

## Future improvement
- https://github.com/gtim/chessdriller


# TODO
- evaluate each move of the game and start classifying them
- make it possible to visualize a line