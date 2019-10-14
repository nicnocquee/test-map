import React from 'react';
import { render } from 'react-dom';
import Map from './Map';
import './style.css';

render(<Map center={{ lat: -23.533773, lng: -46.625290 }} zoom={12} />, document.getElementById('root'));
