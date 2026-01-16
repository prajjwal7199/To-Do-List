import React, { useState, useEffect } from "react";
import {
Box, 
Typography,
Button,
IconButton, 
Paper,
LinearProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow"; 
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop"; 
import { useDispatch } from "react-redux";
import { incrementPomodoro } from "../redux/slices/tasksSlice";

type Props = {
    taskId: string;
    taskTitle: string;
};

export default function PomodoroTimer({ taskId, taskTitle}: Props) {
const [minutes, setMinutes] = useState(25);
const [seconds, setSeconds] = useState(0);
const [isRunning, setIsRunning] = useState(false); 
const [isBreak, setIsBreak] = useState(false);
const dispatch = useDispatch();

const totalSeconds=isBreak? 5 * 60: 25 * 60;
const elapsed = totalSeconds - (minutes * 60 + seconds); 
const progress = (elapsed / totalSeconds) * 100;
useEffect(() => {
let interval: any = null;

if (isRunning) {
interval = setInterval(() => {
if (seconds === 0) {
if (minutes === 0) { // Timer complete 
setIsRunning(false); 
if (!isBreak) {
    dispatch(incrementPomodoro({ id: taskId, minutes: 25 }));
    alert(
        `Pomodoro complete for: ${taskTitle}!\nTake a 5-minute break.`
    );
}
setIsBreak(true);
setMinutes(5);
}
else {
alert("Break complete! Ready for another pomodoro?");
setIsBreak(false);
setMinutes (25);
}
setSeconds(0);
} else {
setMinutes(minutes - 1);
setSeconds (59);
}
} else {
    setSeconds(seconds - 1);
}
}, 1000);
}
return () => {
    if (interval) clearInterval(interval);
};
}, [isRunning, minutes, seconds, isBreak, dispatch, taskId, taskTitle]);

const handleStart = () => setIsRunning (true); 
const handlePause = () => setIsRunning (false); 
const handleStop = () => {
setIsRunning(false);
setMinutes(isBreak? 5:25); 
setSeconds(0);
};

return (
<Paper sx={{ p: 2, borderRadius: 2 }}>
<Typography variant="subtitle2" gutterBottom>
{isBreak?"☕ Break Time" :"🍅 Focus Time"}
</Typography>
<Typography
variant="caption"
color="text.secondary"
sx={{ display: "block", mb: 1 }}
>
{taskTitle}
</Typography>

<Box sx={{ textAlign: "center", my: 2 }}>
<Typography
variant="h3"
component="div"
sx={{ fontFamily: "monospace", fontWeight: 700 }}
>
{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
</Typography>
</Box>

<LinearProgress
variant="determinate"
value={progress}
sx={{ mb: 2, height: 6, borderRadius: 3 }}
/>

<Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}> 
    {!isRunning ? (
<IconButton onClick={handleStart} color="primary" size="large"> 
    <PlayArrowIcon />
</IconButton>
): (
<IconButton onClick={handlePause} color="warning" size="large">
<PauseIcon />
</IconButton>
)}
<IconButton onClick={handleStop} color="error" size="large">
<StopIcon />
</IconButton>
</Box>
</Paper>
);
}
