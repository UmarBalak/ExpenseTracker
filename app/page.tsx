"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface Expense {
  id: string
  date: string
  category: string
  amount: number
  description: string
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filterCategory, setFilterCategory] = useState("All")
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Food",
    amount: "",
    description: "",
  })

  // Load from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem("expenses")
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses))
      } catch (error) {
        console.error("Failed to parse expenses:", error)
      }
    }
  }, [])

  // Save to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses))
  }, [expenses])

  const categories = ["Food", "Transport", "Entertainment", "Utilities", "Health", "Shopping", "Other"]
  const uniqueCategories = ["All", ...categories]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddExpense = () => {
    if (!formData.date || !formData.category || !formData.amount) {
      alert("Please fill in all required fields")
      return
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      date: formData.date,
      category: formData.category,
      amount: Number.parseFloat(formData.amount),
      description: formData.description,
    }

    setExpenses([newExpense, ...expenses])
    setFormData({
      date: new Date().toISOString().split("T")[0],
      category: "Food",
      amount: "",
      description: "",
    })
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  const handleDeleteAll = () => {
    if (window.confirm("Are you sure you want to delete ALL expenses? This action cannot be undone.")) {
      setExpenses([])
    }
  }

  const handleDeleteByCategory = () => {
    if (filterCategory === "All") {
      alert("Please select a specific category to delete")
      return
    }

    const count = expenses.filter((expense) => expense.category === filterCategory).length
    if (count === 0) {
      alert(`No expenses found in category: ${filterCategory}`)
      return
    }

    if (
      window.confirm(
        `Are you sure you want to delete all ${count} expense(s) in category "${filterCategory}"? This action cannot be undone.`,
      )
    ) {
      setExpenses(expenses.filter((expense) => expense.category !== filterCategory))
    }
  }

  const filteredExpenses =
    filterCategory === "All" ? expenses : expenses.filter((expense) => expense.category === filterCategory)

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const downloadPDF = async () => {
    if (filteredExpenses.length === 0) {
      alert("No expenses to download")
      return
    }

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      // Title
      doc.setFontSize(24)
      doc.setFont("", "bold")
      doc.text("Expense Tracker Report", pageWidth / 2, 20, { align: "center" })

      // Date range info
      doc.setFontSize(10)
      doc.setFont("", "normal")
      const reportDate = new Date().toLocaleDateString()
      doc.text(`Report Generated: ${reportDate}`, pageWidth / 2, 28, { align: "center" })

      if (filterCategory !== "All") {
        doc.text(`Category: ${filterCategory}`, pageWidth / 2, 34, { align: "center" })
      }

      // Prepare table data - plain numbers only
      const tableData = filteredExpenses.map((expense) => [
        expense.date,
        expense.category,
        expense.amount.toFixed(2),
        expense.description || "-",
      ])

      // Add table - INR in header only
      autoTable(doc, {
        head: [["Date", "Category", "Amount (INR)", "Description"]],
        body: tableData,
        startY: filterCategory !== "All" ? 42 : 36,
        theme: "grid",
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 11,
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 10,
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        columnStyles: {
          2: { halign: "right" },
        },
        margin: { left: 12, right: 12 },
      })

      // Add total amount at the bottom - INR in total
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.setFont("", "bold")
      doc.setFontSize(12)
      doc.text(`Total Amount: INR ${totalAmount.toFixed(2)}`, pageWidth / 2, finalY, { align: "center" })

      // Footer
      doc.setFontSize(8)
      doc.setFont("", "normal")
      doc.text(
        "This is an automatically generated report from Expense Tracker",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        {
          align: "center",
        },
      )

      // Save PDF
      doc.save(`expense-report-${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF")
    }
  }

  return (
    <>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px 16px;
        }

        @media (min-width: 768px) {
          .container {
            padding: 40px 20px;
          }
        }

        .header-title {
          text-align: center;
          font-size: 24px;
          margin-bottom: 16px;
          letter-spacing: 1.5px;
        }

        @media (min-width: 768px) {
          .header-title {
            font-size: 28px;
            margin-bottom: 20px;
            letter-spacing: 2px;
          }
        }

        .header-divider {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }

        @media (min-width: 768px) {
          .header-divider {
            margin-bottom: 40px;
          }
        }

        .form-container {
          background: #f9f9f9;
          padding: 20px 16px;
          margin-bottom: 32px;
          border: 1px solid #ddd;
        }

        @media (min-width: 768px) {
          .form-container {
            padding: 24px;
          }
        }

        .form-container h2 {
          margin-bottom: 20px;
          font-size: 16px;
          letter-spacing: 1px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          border: 1px solid #ccc;
          background: white;
        }

        .form-button {
          width: 100%;
          padding: 12px;
          background: #000;
          color: #fff;
          border: none;
          font-size: 14px;
          cursor: pointer;
          font-weight: 600;
        }

        @media (min-width: 768px) {
          .form-button {
            width: auto;
            padding: 12px 32px;
          }
        }

        .form-button:hover {
          background: #333;
        }

        .history-container {
          background: #fff;
          border: 1px solid #ddd;
          padding: 16px;
        }

        @media (min-width: 768px) {
          .history-container {
            padding: 24px;
          }
        }

        .history-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        @media (min-width: 768px) {
          .history-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
        }

        .history-title {
          font-size: 16px;
          letter-spacing: 1px;
          margin: 0;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        @media (min-width: 768px) {
          .button-group {
            flex-direction: row;
            gap: 12px;
          }
        }

        .action-button {
          padding: 10px 16px;
          font-size: 14px;
          cursor: pointer;
          border: none;
          font-weight: 600;
          white-space: nowrap;
        }

        .btn-download {
          background-color: #000;
          color: #fff;
        }

        .btn-download:hover {
          background-color: #333;
        }

        .btn-delete-category {
          background-color: #dc2626;
          color: #fff;
        }

        .btn-delete-category:hover {
          background-color: #b91c1c;
        }

        .btn-delete-all {
          background-color: #991b1b;
          color: #fff;
        }

        .btn-delete-all:hover {
          background-color: #7f1d1d;
        }

        .filter-container {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        @media (min-width: 768px) {
          .filter-container {
            flex-direction: row;
            align-items: center;
            gap: 12px;
          }
        }

        .filter-label {
          font-size: 14px;
          font-weight: 500;
        }

        .filter-select {
          padding: 8px 12px;
          font-size: 14px;
          border: 1px solid #ccc;
          background: white;
        }

        @media (min-width: 768px) {
          .filter-select {
            width: 200px;
          }
        }

        .empty-state {
          padding: 40px 20px;
          text-align: center;
          background-color: #ffffff;
          border: 1px solid #d0d0d0;
        }

        .empty-state p {
          color: #666666;
          font-size: 14px;
          margin: 0;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .expense-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
          font-size: 13px;
        }

        @media (min-width: 768px) {
          .expense-table {
            font-size: 14px;
          }
        }

        .expense-table thead {
          background: #000;
          color: #000000ff;
        }

        .expense-table th,
        .expense-table td {
          padding: 10px 8px;
          text-align: left;
          border: 1px solid #ddd;
        }

        @media (min-width: 768px) {
          .expense-table th,
          .expense-table td {
            padding: 12px;
          }
        }

        .expense-table th {
          font-weight: 600;
          font-size: 13px;
        }

        @media (min-width: 768px) {
          .expense-table th {
            font-size: 14px;
          }
        }

        .expense-table tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        .expense-table tbody tr:hover {
          background-color: #f0f0f0;
        }

        .delete-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 600;
        }

        @media (min-width: 768px) {
          .delete-btn {
            padding: 8px 16px;
            font-size: 13px;
          }
        }

        .delete-btn:hover {
          background: #b91c1c;
        }

        .total-section {
          background-color: #ffffff;
          padding: 16px 12px;
          border-top: 2px solid #d0d0d0;
          margin-top: 0;
          text-align: right;
          font-size: 14px;
        }

        @media (min-width: 768px) {
          .total-section {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="container">
        {/* Header */}
        <h1 className="header-title">Expense Tracker</h1>
        <div className="header-divider"></div>

        {/* Add Expense Form */}
        <div className="form-container">
          <h2>Add Expense</h2>

          <div className="form-group">
            <label className="form-label">Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category:</label>
            <select name="category" value={formData.category} onChange={handleInputChange} className="form-select">
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (INR):</label>
            <input
              type="number"
              name="amount"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description:</label>
            <input
              type="text"
              name="description"
              placeholder="Optional"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <button onClick={handleAddExpense} className="form-button">
            Add
          </button>
        </div>

        {/* Expense History */}
        <div className="history-container">
          <div className="history-header">
            <h2 className="history-title">Expense History</h2>
            {filteredExpenses.length > 0 && (
              <div className="button-group">
                <button onClick={downloadPDF} className="action-button btn-download">
                  Download PDF
                </button>
                {filterCategory !== "All" && (
                  <button onClick={handleDeleteByCategory} className="action-button btn-delete-category">
                    Delete Category
                  </button>
                )}
                <button onClick={handleDeleteAll} className="action-button btn-delete-all">
                  Delete All
                </button>
              </div>
            )}
          </div>

          <div className="filter-container">
            <label className="filter-label">Filter by category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <p>No expense data available.</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="expense-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Amount (INR)</th>
                      <th>Description</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{expense.date}</td>
                        <td>{expense.category}</td>
                        <td>{expense.amount.toFixed(2)}</td>
                        <td>{expense.description || "-"}</td>
                        <td>
                          <button className="delete-btn" onClick={() => handleDeleteExpense(expense.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="total-section">
                <strong>Total: INR {totalAmount.toFixed(2)}</strong>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
  