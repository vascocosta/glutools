const std = @import("std");
const clap = @import("clap");
const mem = std.mem;
const Allocator = mem.Allocator;
const GeneralPurposeAllocator = std.heap.GeneralPurposeAllocator;
const ArrayList = std.ArrayList;
const print = std.debug.print;
const sleep = std.time.sleep;

const Delta = struct {
    hours: u8,
    minutes: u8,

    fn parse(alloc: Allocator, delta_str: []const u8) !Delta {
        var hours: u8 = 0;
        var minutes: u8 = 0;
        var number = ArrayList(u8).init(alloc);
        defer number.deinit();

        for (delta_str) |c| {
            switch (c) {
                'h' => {
                    hours = try std.fmt.parseInt(u8, number.items, 10);
                    number.clearAndFree();
                },
                'm' => {
                    minutes = try std.fmt.parseInt(u8, number.items, 10);
                    number.clearAndFree();
                },
                else => {
                    if (std.ascii.isDigit(c)) {
                        try number.append(c);
                    } else {
                        return error.Unknown;
                    }
                },
            }
        }

        return .{
            .hours = hours,
            .minutes = minutes,
        };
    }
};

fn remind(alloc: Allocator, delta_str: []const u8, message: []const u8, once: bool) !void {
    const delta = Delta.parse(alloc, delta_str) catch |err| {
        switch (err) {
            error.Overflow => {
                print("Duration too long.\n", .{});
            },
            else => {
                print("Syntax error.\n", .{});
            },
        }
        return;
    };
    print("Remind in {} hour(s) and {} minute(s).\n", .{ delta.hours, delta.minutes });

    const nsh = std.time.ns_per_hour;
    const nsm = std.time.ns_per_min;
    const nanoseconds = @as(u64, delta.hours) * nsh + @as(u64, delta.minutes) * nsm;
    sleep(nanoseconds);
    print("\x1b[2J\x1b[H\n", .{});

    while (true) {
        print("\x07{s}\n", .{message});
        if (once) return;
        sleep(0.5 * nsm);
    }
}

pub fn main() !void {
    var gpa = GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();

    const params = comptime clap.parseParamsComptime(
        \\-h, --help         Print help
        \\-o, --once         Run reminder only once
        \\<DELTA>            Time to wait before the reminder triggers (ex: 2h30m)
        \\<MESSAGE>          Optional reminder message (ex: "Go for a walk")
    );

    const parsers = comptime .{
        .DELTA = clap.parsers.string,
        .MESSAGE = clap.parsers.string,
    };

    var res = clap.parse(clap.Help, &params, parsers, .{
        .allocator = gpa.allocator(),
    }) catch {
        return clap.usage(std.io.getStdErr().writer(), clap.Help, &params);
    };
    defer res.deinit();

    if (res.args.help != 0)
        return clap.help(std.io.getStdErr().writer(), clap.Help, &params, .{});
    if (res.positionals.len == 0)
        return print("Usage: remind [OPTIONS] <DELTA> [MESSAGE]", .{});

    const once = res.args.once != 0;
    if (res.positionals.len >= 2) {
        try remind(gpa.allocator(), res.positionals[0], res.positionals[1], once);
    } else {
        try remind(gpa.allocator(), res.positionals[0], "Time is up!", once);
    }
}
