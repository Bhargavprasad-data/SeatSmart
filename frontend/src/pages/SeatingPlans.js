import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiDownload, FiFileText, FiEdit2 } from 'react-icons/fi';

const SeatingPlans = () => {
  const [plans, setPlans] = useState([]);
  const [exams, setExams] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [conflicts, setConflicts] = useState(null);
  const [showConflictsModal, setShowConflictsModal] = useState(false);
  const [generateData, setGenerateData] = useState({
    examId: '',
    facultyIds: [],
    crossBranchMixing: false
  });

  useEffect(() => {
    fetchPlans();
    fetchExams();
    fetchFaculty();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/seating-plan');
      setPlans(response.data);
    } catch (error) {
      toast.error('Error fetching seating plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/exams');
      setExams(response.data.filter(exam => exam.status === 'scheduled'));
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/faculty');
      setFaculty(response.data);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/seating-plan/generate', generateData);
      toast.success('Seating plan generated successfully!');
      setShowGenerateModal(false);
      setGenerateData({ examId: '', facultyIds: [], crossBranchMixing: false });
      fetchPlans();
    } catch (error) {
      if (error.response?.data?.conflicts) {
        setConflicts(error.response.data.conflicts);
        setShowConflictsModal(true);
      } else {
        toast.error(error.response?.data?.message || 'Error generating seating plan');
      }
    }
  };

  const toggleFaculty = (facultyId) => {
    setGenerateData(prev => ({
      ...prev,
      facultyIds: prev.facultyIds.includes(facultyId)
        ? prev.facultyIds.filter(id => id !== facultyId)
        : [...prev.facultyIds, facultyId]
    }));
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setGenerateData({
      examId: plan.examId?._id || plan.examId,
      facultyIds: plan.facultyIds?.map(f => f._id || f) || [],
      crossBranchMixing: false
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5000/api/seating-plan/${editingPlan._id}`,
        { facultyIds: generateData.facultyIds }
      );
      toast.success('Faculty assignments updated successfully!');
      setShowEditModal(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      if (error.response?.data?.conflicts) {
        setConflicts(error.response.data.conflicts);
        setShowConflictsModal(true);
      } else {
        toast.error(error.response?.data?.message || 'Error updating faculty assignments');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this seating plan?')) {
      try {
        await axios.delete(`http://localhost:5000/api/seating-plan/${id}`);
        toast.success('Seating plan deleted successfully');
        fetchPlans();
      } catch (error) {
        toast.error('Error deleting seating plan');
      }
    }
  };

  const handleDownload = async (planId, format) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/seating-plan/${planId}/download/${format}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `seating-plan-${planId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Error downloading file');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Seating Plans</h1>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiPlus className="mr-2" />
          Generate Plan
        </button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            No seating plans found. Generate one to get started.
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {plan.examId?.subject} ({plan.examId?.subjectCode})
                  </h3>
                  <p className="text-gray-600">
                    {new Date(plan.examId?.date).toLocaleDateString()} • {plan.examId?.startTime} - {plan.examId?.endTime}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    title="Edit Faculty"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDownload(plan._id, 'pdf')}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    title="Download PDF"
                  >
                    <FiFileText />
                  </button>
                  <button
                    onClick={() => handleDownload(plan._id, 'excel')}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    title="Download Excel"
                  >
                    <FiDownload />
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    title="Delete Plan"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Room</p>
                  <p className="font-medium">{plan.roomId?.roomNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Capacity</p>
                  <p className="font-medium">{plan.occupiedSeats} / {plan.totalSeats}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Faculty</p>
                  <p className="font-medium">{plan.facultyIds?.length || 0} assigned</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Faculty Members:</p>
                <div className="flex flex-wrap gap-2">
                  {plan.facultyIds?.length > 0 ? (
                    plan.facultyIds.map((faculty) => (
                      <span key={faculty._id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {faculty.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No faculty assigned</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Generate Seating Plan</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
                <select
                  value={generateData.examId}
                  onChange={(e) => setGenerateData({...generateData, examId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select an exam</option>
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.subject} - {exam.branch} Year {exam.year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Faculty (Optional)</label>
                <p className="text-xs text-gray-500 mb-2">
                  Select faculty members to oversee this exam. The system will detect any scheduling conflicts.
                </p>
                
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {faculty.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No faculty available</p>
                  ) : (
                    faculty.map((member) => (
                      <label key={member._id} className="flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={generateData.facultyIds.includes(member._id)}
                          onChange={() => toggleFaculty(member._id)}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {member.name} ({member.facultyId}) - {member.department}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                
                {generateData.facultyIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Selected ({generateData.facultyIds.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {generateData.facultyIds.map(facultyId => {
                        const member = faculty.find(f => f._id === facultyId);
                        return member ? (
                          <span key={facultyId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {member.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={generateData.crossBranchMixing}
                  onChange={(e) => setGenerateData({...generateData, crossBranchMixing: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Enable cross-branch mixing for spacing</label>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setGenerateData({ examId: '', facultyIds: [], crossBranchMixing: false });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Edit Faculty Assignments</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Exam: {editingPlan.examId?.subject}</p>
                <p className="text-sm text-gray-600">Room: {editingPlan.roomId?.roomNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Faculty</label>
                <p className="text-xs text-gray-500 mb-2">
                  Select faculty members for this exam. Conflicts with existing schedules will be detected.
                </p>
                
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {faculty.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No faculty available</p>
                  ) : (
                    faculty.map((member) => (
                      <label key={member._id} className="flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={generateData.facultyIds.includes(member._id)}
                          onChange={() => toggleFaculty(member._id)}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {member.name} ({member.facultyId}) - {member.department}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                
                {generateData.facultyIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Selected ({generateData.facultyIds.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {generateData.facultyIds.map(facultyId => {
                        const member = faculty.find(f => f._id === facultyId);
                        return member ? (
                          <span key={facultyId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {member.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConflictsModal && conflicts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-red-600">Faculty Assignment Conflicts Detected</h2>
            <p className="text-gray-700 mb-4">
              The following faculty members are already assigned to another exam at the same time:
            </p>
            
            <div className="space-y-3">
              {conflicts.map((conflict, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-red-800">
                        {conflict.facultyName || 'Faculty'} ({conflict.facultyFacultyId || conflict.facultyId})
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Already assigned to: <span className="font-medium">
                          {conflict.conflictingExam} 
                          {conflict.conflictingExamCode && ` (${conflict.conflictingExamCode})`}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(conflict.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Time: {conflict.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowConflictsModal(false);
                  setConflicts(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatingPlans;

