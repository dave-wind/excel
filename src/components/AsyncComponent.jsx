import React, {Component} from 'react';
import Loading from './Loading/Loading.jsx';

export const AsyncComponent = (importComponent) => {
  return class AsyncComponent extends Component {
    constructor(props) {
      super(props);
      this.state = {
        component: null
      };
    }

    async componentDidMount() {
      const {default: component} = await importComponent();
      this.setState({
        component,
      });
    }

    render() {
      const WrappedComponent = this.state.component;
      return WrappedComponent ? <WrappedComponent {...this.props} /> : <Loading/>;
    }
  }
};

