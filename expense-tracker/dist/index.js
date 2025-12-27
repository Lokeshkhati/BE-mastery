import express from 'express';
import mongoose from "mongoose";
const app = express();
const port = 3000;
app.get('/', (req, res) => {
    res.send(`Hello Expense okok!`);
});
// app.get('/fullname', (req, res) => {
//     const {firstName, lastName} = req.query ??''
//     const fullName = `${firstName ??""}  ${lastName ??""}`
//     console.log(res.send)
//   res.send(`Fullname : ${fullName}`, )
// })
// app.get('/calculateSalary', (req, res) => {
//     const { salary1, salary2 } = req.query
//     const totalSalary = parseInt(salary1) + parseInt(salary2)
//     res.send(`Total salary is ${totalSalary}`)
// })
// app.get("/average-sales", (req, res) => {
//     const { salary1, salary2 } = req.query;
//     const avgSales =
//       parseInt(salary1) + parseInt(salary2);
//     res.send(avgSales.toString());
//   });
// Expense tracker 
{ /*
    auth --> /signup  | /login
    expense --> /create | update | delete | get | single expense |

    */
}
// Connect with DB
console.log({ mongoose });
app.get('/expense', (req, res) => {
});
app.listen(port, () => {
    console.log(`Expense tracker app listening on port ${port}`);
});
