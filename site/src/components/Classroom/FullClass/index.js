import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useParams } from 'react-router-dom';
import { getEnrolledCourses } from 'g_actions/student';
import Loader from '../../Loading';
import Classes from '../Classes';
import ResourceBtn from '../../ResourceButton';
import NavBar from '../../CourseNav';
import assignment from 'assets/icons/course/assignment.png';
import Layout from '../../../Layouts/SideNavListLayout';
import './style.scss';

function FullClass({ gapi }) {
  const { courseId, classroom } = useParams();

  const dispatch = useDispatch();
  const enrolledcourses = useSelector((state) => state.student.enrolledcourses);
  const currentCourse = useSelector((state) => state.student.currentCourse);

  useEffect(() => {
    if (!enrolledcourses && !currentCourse)
      (async () => {
        await dispatch(getEnrolledCourses(courseId));
      })();

    return () => {};
  }, [dispatch, enrolledcourses, courseId, currentCourse]);

  useEffect(() => {
    if (!enrolledcourses) return;
    if (currentCourse) return;

    dispatch(
      getEnrolledCourses(
        courseId,
        enrolledcourses &&
          enrolledcourses.find((course) => course.id === courseId)
      )
    );

    return () => {};
  }, [enrolledcourses, courseId, currentCourse, dispatch]);

  return (
    <>
      <NavBar />
      <div className="cx_listnx_full flex-row">
        {!currentCourse ? (
          <Loader tempLoad={true} full={false} />
        ) : (
          <Layout
            links={currentCourse.CourseCohort.Classes.map((classroom, i) => (
              <li key={`side_link_courses_${i}`}>
                <NavLink
                  className="side_link"
                  to={`/courses/classroom/${courseId}/${classroom.id}`}
                >
                  Week {i + 1}
                </NavLink>
              </li>
            ))}
          >
            <Classes
              data={currentCourse.CourseCohort.Classes.find(
                (classrum) => classrum.id === classroom
              )}
              open={true}
              showArrow={false}
              full={true}
              gapi={gapi}
            />
            <div className="btns">
              <div className="reg_text">
                <h4>Activities</h4>
                <div className="btn_sec_con flex-row j-start">
                  <div className="btn_sec">
                    <ResourceBtn
                      img={assignment}
                      text="Submit Assignment"
                      color="approved"
                      link={`/courses/assignment/${courseId}/${classroom}`}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="prev_courses"></div>
          </Layout>
        )}
      </div>
    </>
  );
}
export default FullClass;
