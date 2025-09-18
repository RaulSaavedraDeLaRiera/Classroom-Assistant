import React from 'react';
import { CourseProgressViewProps, useIsMobile } from './CourseProgressViewCommon';
import { CourseProgressView as CourseProgressViewMobile } from './CourseProgressViewMobile';
import CourseProgressViewDesktop from './CourseProgressView';

const CourseProgressView: React.FC<CourseProgressViewProps> = React.memo((props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <CourseProgressViewMobile {...props} />;
  }

  return <CourseProgressViewDesktop {...props} />;
});

CourseProgressView.displayName = 'CourseProgressView';

export default CourseProgressView;
