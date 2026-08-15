/**
 * @format
 */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-floating-promises */

import React from 'react';
import { act, create } from 'react-test-renderer';
import App from '../App';

test('renders correctly', () => {
  void act(() => {
    create(<App />);
  });
});
