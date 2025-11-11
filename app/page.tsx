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
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <h1 style={{ textAlign: "center", fontSize: "28px", marginBottom: "20px", letterSpacing: "2px" }}>
        Expense Tracker
      </h1>
      <div
        style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "40px" }}
      ></div>

      {/* Add Expense Form */}
      <div className="form-container">
        <h2 style={{ marginBottom: "24px", fontSize: "16px", letterSpacing: "1px" }}>Add Expense</h2>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Date:</label>
          <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Category:</label>
          <select name="category" value={formData.category} onChange={handleInputChange}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Amount (INR):</label>
          <input
            type="number"
            name="amount"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleInputChange}
            step="0.01"
            min="0"
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Description:</label>
          <input
            type="text"
            name="description"
            placeholder="Optional"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        <button onClick={handleAddExpense}>Add</button>
      </div>

      {/* Expense History */}
      <div className="history-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", letterSpacing: "1px" }}>Expense History</h2>
          {filteredExpenses.length > 0 && (
            <button
              onClick={downloadPDF}
              style={{
                backgroundColor: "#000",
                color: "#fff",
                padding: "8px 16px",
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
              }}
            >
              Download PDF
            </button>
          )}
        </div>

        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={{ fontSize: "14px" }}>Filter by category:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ width: "200px" }}>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {filteredExpenses.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #d0d0d0",
            }}
          >
            <p style={{ color: "#666666", fontSize: "14px" }}>No expense data available.</p>
          </div>
        ) : (
          <>
            <table>
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

            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "16px 12px",
                borderTop: "2px solid #d0d0d0",
                marginTop: "16px",
                textAlign: "right",
              }}
            >
              <strong>Total: INR {totalAmount.toFixed(2)}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
