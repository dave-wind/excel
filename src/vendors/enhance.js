/**
 * Created by dave on 2018/12/10.
 */
import {withRouter} from 'react-router-dom';
import {message} from 'antd';

/**
 * 反向继承注入方法
 * @param {Class} Component
 * @return {Class} Component
 */
const withMethods = WrappedComponent => {
  return class extends WrappedComponent {
    componentDidMount(...args) {
      console.log('message----------', message);
      super.componentDidMount && super.componentDidMount(...args);
    }

    success(...arg) {
      message.success.call(null, ...arg);
    }

    error(...arg) {
      message.error.call(null, ...arg);
    }

    render() {
      return super.render();
    }
  }
};

export default component => {
  return withRouter(withMethods(component));
}
