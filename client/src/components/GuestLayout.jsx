import "../style/GuestLayout.css";
import React, { useState, useEffect } from 'react';
import { Outlet } from "react-router-dom";

export default function GuestLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [usersWithSubjects, setUsersWithSubjects] = useState([]);
  const [cityName, setCityName] = useState('');
  const [weatherData, setWeatherData] = useState(null); // New state for weather data
  const [reviewContent, setReviewContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('https://my-project-second-407301.wm.r.appspot.com/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cityName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const handleReviewSubmit = async (userId) => {
    try {
      const response = await fetch(`https://my-project-second-407301.wm.r.appspot.com/tutor/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: reviewContent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const newReview = await response.json();
      console.log('New Review:', newReview);

      // Assuming you want to update the state with the new review
      setUsersWithSubjects((prevUsers) => {
        return prevUsers.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              reviews: [...user.reviews, newReview],
            };
          }
          return user;
        });
      });

      // Clear the review content after submission
      setReviewContent('');

    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://my-project-second-407301.wm.r.appspot.com/guest');
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
        setUsersWithSubjects(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = new Date(dateString).toLocaleDateString('en-US', options);
    return formattedDate;
  }

  return (
    <div className="app">
      <div className="title">
        <h1>Tutorlist</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="cityInput">City Name: </label>
        <input
          id="cityInput"
          type="text"
          name="cityName"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
        />
        <button type="submit">Get Weather</button>
      </form>

      {/* Display weather information if available */}
      {weatherData && (
        <div className="weather-info">
          <h2>Weather in {cityName}</h2>
          <p>Temperature: {weatherData.main.temp}°C</p>
          <p>Description: {weatherData.weather[0].description}</p>
        </div>
      )}

      <div className="content">
        {usersWithSubjects.map((user) => (
          <div key={user.id}>
            <h2>Tutor: {user.name}</h2>
            <h2>Tutor Contact: {user.email}</h2>
            <ul>
              {user.subjects.map((subject) => (
                <li key={subject.id}>
                  <h3>Subject: {subject.title}</h3>
                  <h3>Subject Description: {subject.description}</h3>
                </li>
              ))}
            {user.reviews.length > 0 && (
              <>
                <h2>Reviews</h2>
                <ul>
                  {user.reviews.map((review) => (
                    <li key={review.id}>
                      <h3>
                        Anonymous User on {formatDate(review.createdAt)}: {review.content}
                      </h3>
                    </li>
                  ))}
                </ul>
              </>
            )}
            </ul>
            <form onSubmit={(e) => { e.preventDefault(); handleReviewSubmit(user.id); }}>
        <label htmlFor="reviewContent">Write a Review for {user.name}: </label>
        <textarea
          id="reviewContent"
          name="reviewContent"
          value={reviewContent}
          minLength="2" maxLength="250"
          onChange={(e) => setReviewContent(e.target.value)}
        />
        <button type="submit">Submit Review</button>
      </form>
          </div>
        ))}
      </div>

      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}

