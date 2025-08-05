export interface TransferStrategy {
  transfer(senderId: number, receiverId: number, amount: number): Promise<void>;
}
