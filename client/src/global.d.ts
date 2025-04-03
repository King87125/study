declare module '*.tsx';

declare module 'components/planner/Countdown' {
  import { FC } from 'react';
  
  interface CountdownProps {
    examDate: string;
    onChangeDate: (date: string) => void;
  }
  
  const Countdown: FC<CountdownProps>;
  export default Countdown;
}

declare module 'components/planner/StudyCalendar' {
  import { FC } from 'react';
  
  interface StudyCalendarProps {
    examDate: string;
  }
  
  const StudyCalendar: FC<StudyCalendarProps>;
  export default StudyCalendar;
}

declare module 'components/planner/StudyProgress' {
  import { FC } from 'react';
  
  interface StudyProgressProps {
    examDate: string;
  }
  
  const StudyProgress: FC<StudyProgressProps>;
  export default StudyProgress;
}

declare module 'components/planner/TaskList' {
  import { FC } from 'react';
  
  interface TaskListProps {
    examDate: string;
  }
  
  const TaskList: FC<TaskListProps>;
  export default TaskList;
} 