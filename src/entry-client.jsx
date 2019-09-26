import React from 'react'
import {render} from 'react-dom';
import Router from '@/router/index.jsx';
import {basePath} from '../config.js';
import './sass/index.scss';

import 'core-js/fn/promise'
import 'core-js/fn/object'
import 'core-js/fn/array'
import 'core-js/fn/set'
import 'core-js/fn/map'

const App = Router(basePath);

render(
    <App/>,
    document.getElementById("app")
);
