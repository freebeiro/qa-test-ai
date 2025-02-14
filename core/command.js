// Command interface
class Command {
    execute() {
        throw new Error('Command must implement execute method');
    }
}

export default Command;
