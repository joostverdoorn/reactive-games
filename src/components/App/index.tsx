import * as React from 'react';
import { Route } from 'react-router';
import { Link, BrowserRouter } from 'react-router-dom';
import Asteroids from '../Asteroids';
import Dinosaur from '../Dinosaur';
import GameOfLife from '../GameOfLife';
import Snake from '../Snake';
import TicTacToe from '../TicTacToe';

import './index.css';

class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <div className="App">
          <header className="App-header">
            <Link className="App-nav-button" to="/asteroids">Asteroids</Link>
            <Link className="App-nav-button" to="/dinosaur">Dinosaur</Link>
            <Link className="App-nav-button" to="/gameoflife">Game Of Life</Link>
            <Link className="App-nav-button" to="/snake">Snake</Link>
            <Link className="App-nav-button" to="/tictactoe">Tic Tac Toe</Link>
          </header>
          <Route path="/asteroids" component={Asteroids} />
          <Route path="/dinosaur" component={Dinosaur} />
          <Route path="/gameoflife" component={GameOfLife} />
          <Route path="/snake" component={Snake} />
          <Route path="/tictactoe" component={TicTacToe} />
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
