import { useState, useEffect } from 'react';

interface CountdownResult {
  timeRemaining: string;
  isExpired: boolean;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useCountdown(endTime: Date): CountdownResult {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTimeMs = endTime.getTime();
      const difference = endTimeMs - now;

      if (difference <= 0) {
        setTimeRemaining('Expired');
        setIsExpired(true);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        return;
      }

      const hoursLeft = Math.floor(difference / (1000 * 60 * 60));
      const minutesLeft = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const secondsLeft = Math.floor((difference % (1000 * 60)) / 1000);

      setHours(hoursLeft);
      setMinutes(minutesLeft);
      setSeconds(secondsLeft);

      if (hoursLeft > 0) {
        setTimeRemaining(`${hoursLeft}h ${minutesLeft}m`);
      } else {
        setTimeRemaining(`${minutesLeft}m ${secondsLeft}s`);
      }
      
      setIsExpired(false);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return { timeRemaining, isExpired, hours, minutes, seconds };
}