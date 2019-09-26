import React from 'react';
import {BrowserRouter as Router, Switch, Route,Redirect} from 'react-router-dom';
import { AsyncComponent } from '../components/AsyncComponent.jsx'

const Index = AsyncComponent(() => import('../pages/index.jsx'));

const RouterConfig = basePath => {
  return () => (
      <Router>
        <Switch>
          <Route path={`${basePath}/index.html`} component={Index}/>
          <Redirect to={`${basePath}/index.html`}/>
        </Switch>
      </Router>
  );
}
export default RouterConfig;
