import { program } from "commander";
import chalk from "chalk";
import { homedir } from "os";
import path from "path";
import { DB_FILE, taskService } from "./tasks.js";

program.name("todo").description("Simple TODO CLI app.").version("1.0.0");

program
    .command("add")
    .argument("<task>", "Task description")
    .description("Add a new task")
    .action(async (task: string) => {
        await taskService.addTask(task).match(
            () => console.log(chalk.green("Task added.")),
            (e) => console.log(chalk.red(e.message))
        );
    });

program
    .command("createdb")
    .description(
        `Create a database for your tasks: ${path.join(homedir(), DB_FILE)}`
    )
    .action(async () => {
        await taskService.createDB().match(
            () => console.log(chalk.green("DB created successfully.")),
            (e) => console.log(chalk.red(`Failed to create DB: ${e.message}`))
        );
    });

program
    .command("list")
    .description("List all tasks")
    .action(async () => {
        const result = await taskService.listTasks();
        if (result.isErr()) {
            console.log(chalk.red(result.error.message));
        }
    });

program
    .command("remove")
    .argument("<id>", "Which task to remove")
    .description("Remove a task")
    .action(async (id: string) => {
        await taskService.removeTask(Number(id)).match(
            () => console.log(chalk.green("Task removed.")),
            (e) => console.log(chalk.red(e.message))
        );
    });

program
    .command("toggle")
    .argument("<id>", "Whick task to toggle")
    .description("Toggle a task")
    .action(async (id: string) => {
        await taskService.toggleTask(Number(id)).match(
            () => console.log(chalk.green("Task Toggled.")),
            (e) => console.log(chalk.red(e.message))
        );
    });

program.parseAsync(process.argv);
