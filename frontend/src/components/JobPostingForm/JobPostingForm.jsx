import React, { useState } from "react";
import toast from "react-hot-toast";

const initialState = {
  title: "",
  package: "",
  type: "fulltime",
  description: "",
  skill: "",
  technology: "",
  location: "",
  outDate: "",
};

const JobPostingForm = ({ isOpen, onClose }) => {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.package || !form.type || !form.description || !form.skill || !form.technology || !form.location || !form.outDate) {
      setError("All fields are required.");
      return;
    }
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/v1/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ...form, package: form.package }),
      });
      let data = null;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error('Invalid JSON response: ' + text);
      }
      if (!res.ok) {
        throw new Error((data && data.message) || "Failed to post job");
      }
      toast.success("Job posted successfully!");
      onClose();
      setForm(initialState);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">&times;</button>
        <h2 className="text-xl font-bold mb-4">Post a Job</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-medium">Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block font-medium">Package</label>
            <input name="package" value={form.package} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block font-medium">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded px-2 py-1">
              <option value="freelancer">Freelancer</option>
              <option value="fulltime">Fulltime</option>
              <option value="partime">Partime</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block font-medium">Skill</label>
            <input name="skill" value={form.skill} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block font-medium">Technology</label>
            <input name="technology" value={form.technology} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block font-medium">Location</label>
            <input name="location" value={form.location} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block font-medium">Out Date for Apply</label>
            <input type="date" name="outDate" value={form.outDate} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark">Post Job</button>
        </form>
      </div>
    </div>
  );
};

export default JobPostingForm; 