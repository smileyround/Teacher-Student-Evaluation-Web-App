import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuthToken } from "../AuthTokenContext";

export default function SubjectDetail() {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const { accessToken } = useAuthToken();

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/subjects/${subjectId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
    
        if (response.ok) {
          const subjectData = await response.json();
          setSubject(subjectData);
          setEditedTitle(subjectData.title);
          setEditedDescription(subjectData.description);
        } else {
          throw new Error(`Failed to fetch subject. Status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error fetching subject:", error);
      }
    };
    

    if (subjectId) {
      fetchSubject();
    }
  }, [subjectId]);

  const handleUpdate = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/subjects/${subjectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDescription,
        }),
      });

      if (response.ok) {
        // Optionally, you can update the local state with the edited data
        const updatedSubject = { ...subject, title: editedTitle, description: editedDescription };
        setSubject(updatedSubject);
        alert("Subject updated successfully!");
      } else {
        throw new Error(`Failed to update subject. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating subject:", error);
    }
  };

  return (
    <div>
      {subject ? (
        <>
          <h2>Subject Detail</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              value={editedTitle}
              minLength="2" maxLength="50" required
              onChange={(e) => setEditedTitle(e.target.value)}
            />

            <label htmlFor="description">Description:</label>
            <input
              type="text"
              id="description"
              value={editedDescription}
              minLength="10" maxLength="250" required
              onChange={(e) => setEditedDescription(e.target.value)}
            />

            <button type="submit">Update</button>
          </form>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}