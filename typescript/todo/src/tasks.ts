/**
 * Task management service that supports adding, listing, removing, and toggling tasks.
 * Tasks are stored in a JSON file located in the user's home directory.
 * Uses functional error handling via `neverthrow` for safe asynchronous operations.
 */

import chalk from "chalk";
import fs from "fs/promises";
import { okAsync, ResultAsync } from "neverthrow";
import { homedir } from "os";
import path from "path";

/**
 * Name of the file used to persist task data in the user's home directory.
 */
export const DB_FILE = ".gludo.json";

/**
 * Represents a task object.
 * @property id - Unique identifier for the task.
 * @property text - Description of the task.
 * @property done - Completion status of the task.
 */
export interface Task {
    id: number;
    text: string;
    done: boolean;
}

/**
 * Service responsible for task management operations.
 */
export const taskService = {
    /**
     * Adds a new task to the database.
     * @param text - The description of the task to add.
     * @returns A ResultAsync resolving to void or an Error.
     */
    addTask: (text: string): ResultAsync<void, Error> => {
        return loadTasks()
            .andThen((tasks) => {
                const ids = tasks.map((todo) => todo.id);
                const newTask: Task = {
                    id: nextId(ids),
                    text,
                    done: false,
                };
                return saveTasks([...tasks, newTask]);
            })
            .mapErr((e) => new Error(`Failed to add task: ${e.message}`));
    },

    /**
     * Initializes the task database by creating an empty list.
     * @returns A ResultAsync resolving to void or an Error.
     */
    createDB: (): ResultAsync<void, Error> => {
        return saveTasks([]);
    },

    /**
     * Lists all tasks in the console with their completion status.
     * @returns A ResultAsync resolving to void or an Error.
     */
    listTasks: (): ResultAsync<void, Error> => {
        return loadTasks().andThen((tasks) => {
            if (tasks.length === 0) {
                console.log(chalk.yellow("No tasks found."));
            } else {
                for (const task of tasks) {
                    const done = task.done ? chalk.green("✓") : chalk.red("✗");
                    console.log(`${done} ${task.id} ${task.text}`);
                }
            }
            return okAsync(undefined);
        });
    },

    /**
     * Removes a task with the given ID.
     * @param id - The ID of the task to remove.
     * @returns A ResultAsync resolving to void or an Error.
     */
    removeTask: (id: number): ResultAsync<void, Error> => {
        return loadTasks()
            .andThen((tasks) => {
                tasks = tasks.filter((task) => task.id !== id);
                return saveTasks(tasks);
            })
            .mapErr((e) => new Error(`Failed to remove task: ${e.message}`));
    },

    /**
     * Toggles the completion status of a task by ID.
     * @param id - The ID of the task to toggle.
     * @returns A ResultAsync resolving to void or an Error.
     */
    toggleTask: (id: number): ResultAsync<void, Error> => {
        return loadTasks()
            .andThen((tasks) => {
                for (let task of tasks) {
                    if (task.id === id) task.done = !task.done;
                }
                return saveTasks(tasks);
            })
            .mapErr((e) => new Error(`Failed to toggle task: ${e.message}`));
    },
};

/**
 * Loads tasks from the database file.
 * @returns A ResultAsync resolving to an array of Task or an Error.
 */
function loadTasks(): ResultAsync<Task[], Error> {
    return ResultAsync.fromPromise(
        fs.readFile(path.join(homedir(), DB_FILE), "utf-8").then(JSON.parse),
        () => new Error("Failed to load tasks")
    );
}

/**
 * Saves the given array of tasks to the database file.
 * @param tasks - The array of tasks to save.
 * @returns A ResultAsync resolving to void or an Error.
 */
function saveTasks(tasks: Task[]): ResultAsync<void, Error> {
    return ResultAsync.fromPromise(
        fs.writeFile(
            path.join(homedir(), DB_FILE),
            JSON.stringify(tasks),
            null
        ),
        () => new Error("Failed to save tasks")
    );
}

/**
 * Computes the next available task ID based on a list of existing IDs.
 * @param ids - Array of existing task IDs.
 * @returns The next available task ID.
 */
function nextId(ids: number[]): number {
    ids.sort((a, b) => a - b);
    return ids.length === 0 ? 1 : ids[ids.length - 1] + 1;
}
