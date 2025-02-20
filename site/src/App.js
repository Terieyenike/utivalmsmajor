import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { hot } from 'react-hot-loader';
import Loader from './components/Loading';
import Protected from './components/Protected';
import AProtected from './components/Protected/AdminProtected';
import './App.css';

const HomePage = lazy(() => import('./views/HomePage'));
const Auth = lazy(() => import('./views/Auth'));
const Purchase = lazy(() => import('./views/Purchase'));
const Payment = lazy(() => import('./views/Payment'));
const Dashboard = lazy(() => import('./views/Dashboard'));
const Admin = lazy(() => import('./views/Admin'));
const Courses = lazy(() => import('./views/AllCourses'));

function App() {
  return (
    <main className="App">
      <Router>
        <Loader />
        <Suspense fallback={<Loader tempLoad={true} full={true} />}>
          <Switch>
            <Route path="/home" component={HomePage} />
            <Route path="/auth" component={Auth} />
            <Route path="/purchase/:courseCohortId" component={Purchase} />
            <Route path="/payment/:courseCohortId" component={Payment} />
            <AProtected path="/admin" component={Admin} type="admin" />
            <Route path="/all-courses" component={Courses} />
            <Protected path="/" component={Dashboard} />
          </Switch>
        </Suspense>
      </Router>
    </main>
  );
}

export default hot(module)(App);
